from django.db.models import Count
from django.http import HttpResponse
from io import BytesIO
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from openpyxl import Workbook
from .models import Agent, Equipement, Affectation, Restitution, Incident, Log, AgentInvite
from .serializers import (
    UserSerializer,
    AgentSerializer,
    EquipementSerializer,
    AffectationSerializer,
    RestitutionSerializer,
    IncidentSerializer,
    LogSerializer,
    AgentInviteSerializer,
    AgentSelfRegisterSerializer,
    AgentOpenRegisterSerializer,
)
from .permissions import IsAdmin, IsAdminOrSupervisor, IsAdminOrSupervisorOrReadOnly
from .mixins import AuditLogMixin
from .filters import AgentFilter, EquipementFilter, AffectationFilter, RestitutionFilter, IncidentFilter
from django.contrib.auth import get_user_model


User = get_user_model()


class UserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class AgentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Agent.objects.all().order_by('id')
    serializer_class = AgentSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]
    filterset_class = AgentFilter
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Agent.objects.none()
        if getattr(user, 'role', None) == 'AGENT':
            agent = getattr(user, 'agent_profile', None)
            if agent:
                return Agent.objects.filter(pk=agent.pk)
            return Agent.objects.none()
        return super().get_queryset()


class EquipementViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Equipement.objects.all().order_by('id')
    serializer_class = EquipementSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]
    filterset_class = EquipementFilter

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Equipement.objects.none()
        if getattr(user, 'role', None) == 'AGENT':
            agent = getattr(user, 'agent_profile', None)
            if agent:
                return Equipement.objects.filter(
                    affectations__agent=agent, affectations__is_active=True
                ).distinct()
            return Equipement.objects.none()
        return super().get_queryset()


class AffectationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Affectation.objects.all().order_by('-assigned_at')
    serializer_class = AffectationSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]
    filterset_class = AffectationFilter
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Affectation.objects.none()
        if getattr(user, 'role', None) == 'AGENT':
            agent = getattr(user, 'agent_profile', None)
            if agent:
                return Affectation.objects.filter(agent=agent)
            return Affectation.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        affectation = serializer.save(assigned_by=self.request.user)
        equipement = affectation.equipement
        if equipement.status != Equipement.Status.ASSIGNED:
            equipement.status = Equipement.Status.ASSIGNED
            equipement.save(update_fields=['status'])
        self._log_action(self.request, self.action_create, affectation)

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        affectation = self.get_object()
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        pdf.setTitle(f"Affectation {affectation.id}")

        y = 800
        pdf.setFont('Helvetica-Bold', 16)
        pdf.drawString(40, y, 'Fiche d\'affectation')
        y -= 30
        pdf.setFont('Helvetica', 11)
        pdf.drawString(40, y, f"ID: {affectation.id}")
        y -= 18
        pdf.drawString(40, y, f"Equipement: {affectation.equipement.serial_number}")
        y -= 18
        pdf.drawString(40, y, f"Agent: {affectation.agent.matricule}")
        y -= 18
        pdf.drawString(40, y, f"Affecte le: {affectation.assigned_at:%Y-%m-%d}")
        y -= 18
        if affectation.expected_return_at:
            pdf.drawString(
                40, y, f"Retour prevu: {affectation.expected_return_at:%Y-%m-%d}"
            )
            y -= 18
        pdf.drawString(40, y, f"Statut: {'Active' if affectation.is_active else 'Cloturee'}")
        y -= 18
        if affectation.notes:
            pdf.drawString(40, y, f"Notes: {affectation.notes}")

        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename=affectation_{affectation.id}.pdf'
        )
        return response


class RestitutionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Restitution.objects.all().order_by('-returned_at')
    serializer_class = RestitutionSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]
    filterset_class = RestitutionFilter
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Restitution.objects.none()
        if getattr(user, 'role', None) == 'AGENT':
            agent = getattr(user, 'agent_profile', None)
            if agent:
                return Restitution.objects.filter(affectation__agent=agent)
            return Restitution.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        restitution = serializer.save(received_by=self.request.user)
        affectation = restitution.affectation
        affectation.is_active = False
        affectation.save(update_fields=['is_active'])
        equipement = affectation.equipement
        equipement.condition = restitution.condition
        if restitution.condition == Restitution.Condition.GOOD:
            equipement.status = Equipement.Status.AVAILABLE
        else:
            equipement.status = Equipement.Status.MAINTENANCE
        equipement.save(update_fields=['condition', 'status'])
        self._log_action(self.request, self.action_create, restitution)


class IncidentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-reported_at')
    serializer_class = IncidentSerializer
    permission_classes = [IsAdminOrSupervisorOrReadOnly]
    filterset_class = IncidentFilter

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Incident.objects.none()
        if getattr(user, 'role', None) == 'AGENT':
            agent = getattr(user, 'agent_profile', None)
            if agent:
                return Incident.objects.filter(agent=agent)
            return Incident.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        incident = serializer.save(reported_by=self.request.user)
        equipement = incident.equipement
        if incident.incident_type in [Incident.Type.LOSS, Incident.Type.THEFT]:
            equipement.status = Equipement.Status.LOST
        else:
            equipement.status = Equipement.Status.MAINTENANCE
        equipement.save(update_fields=['status'])
        self._log_action(self.request, self.action_create, incident)

    def perform_update(self, serializer):
        incident = serializer.save()
        if incident.status == Incident.Status.CLOSED and incident.closed_at is None:
            incident.closed_at = timezone.now()
            incident.save(update_fields=['closed_at'])
        self._log_action(self.request, self.action_update, incident)


class LogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Log.objects.all().order_by('-created_at')
    serializer_class = LogSerializer
    permission_classes = [IsAdminOrSupervisor]


class AgentInviteViewSet(viewsets.ModelViewSet):
    queryset = AgentInvite.objects.all().order_by('-created_at')
    serializer_class = AgentInviteSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AgentRegistrationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request, token):
        payload = {**request.data, 'token': token}
        serializer = AgentSelfRegisterSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        agent = serializer.save()
        return Response(
            {
                'agent_id': agent.id,
                'user_id': agent.user_id,
                'username': agent.user.username,
                'matricule': agent.matricule,
            }
        )


class AgentOpenRegistrationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request):
        serializer = AgentOpenRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agent = serializer.save()
        return Response(
            {
                'agent_id': agent.id,
                'user_id': agent.user_id,
                'username': agent.user.username,
                'matricule': agent.matricule,
            }
        )


class ReportsView(APIView):
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        export_format = request.query_params.get('export')
        if export_format == 'excel':
            return self._export_excel()
        if export_format == 'pdf':
            return self._export_pdf()

        equipement_counts = Equipement.objects.values('status').annotate(total=Count('id'))
        incidents_by_type = Incident.objects.values('incident_type').annotate(total=Count('id'))
        incidents_by_status = Incident.objects.values('status').annotate(total=Count('id'))
        agents_active = Agent.objects.filter(status=Agent.Status.ACTIVE).count()
        agents_inactive = Agent.objects.filter(status=Agent.Status.INACTIVE).count()
        data = {
            'equipements_by_status': list(equipement_counts),
            'incidents_by_type': list(incidents_by_type),
            'incidents_by_status': list(incidents_by_status),
            'agents_active': agents_active,
            'agents_inactive': agents_inactive,
        }
        return Response(data)

    def _export_excel(self):
        wb = Workbook()
        ws = wb.active
        ws.title = 'Equipements'
        ws.append(['Type', 'Numero de serie', 'IMEI', 'Statut', 'Etat'])
        for item in Equipement.objects.all().order_by('id'):
            ws.append(
                [
                    item.type,
                    item.serial_number,
                    item.imei or '',
                    item.status,
                    item.condition,
                ]
            )

        ws_agents = wb.create_sheet('Agents')
        ws_agents.append(['Matricule', 'Prenom', 'Nom', 'Telephone', 'Email', 'Statut'])
        for agent in Agent.objects.all().order_by('id'):
            ws_agents.append(
                [
                    agent.matricule,
                    agent.first_name,
                    agent.last_name,
                    agent.phone,
                    agent.email,
                    agent.status,
                ]
            )

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename=rapports.xlsx'
        return response

    def _export_pdf(self):
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        pdf.setTitle('Rapports EquipTrack')
        pdf.setFont('Helvetica-Bold', 16)
        pdf.drawString(40, 800, 'Rapport EquipTrack')
        pdf.setFont('Helvetica', 11)

        equipement_counts = Equipement.objects.values('status').annotate(total=Count('id'))
        incidents_by_type = Incident.objects.values('incident_type').annotate(total=Count('id'))

        y = 760
        pdf.drawString(40, y, 'Equipements par statut:')
        y -= 18
        for item in equipement_counts:
            pdf.drawString(60, y, f"{item['status']}: {item['total']}")
            y -= 16

        y -= 10
        pdf.drawString(40, y, 'Incidents par type:')
        y -= 18
        for item in incidents_by_type:
            pdf.drawString(60, y, f"{item['incident_type']}: {item['total']}")
            y -= 16

        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=rapports.pdf'
        return response

