from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .models import Log, Agent
from .utils import get_client_ip


class IdentifierTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        if identifier:
            User = get_user_model()
            user = User.objects.filter(username=identifier).first()
            if not user:
                user = User.objects.filter(email__iexact=identifier).first()
            if not user:
                user = User.objects.filter(phone=identifier).first()
            if not user:
                agent = Agent.objects.select_related('user').filter(
                    matricule=identifier
                ).first()
                user = agent.user if agent else None
            if user:
                attrs[self.username_field] = user.get_username()
        return super().validate(attrs)


class LoginView(TokenObtainPairView):
    serializer_class = IdentifierTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = getattr(serializer, 'user', None)
        if user:
            Log.objects.create(
                user=user,
                action='LOGIN',
                target_type='User',
                target_id=str(user.pk),
                details={'username': user.username},
                ip_address=get_client_ip(request),
            )
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
