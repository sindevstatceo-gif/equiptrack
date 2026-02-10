import django_filters
from django.db.models import Q

from .models import Agent, Equipement, Affectation, Restitution, Incident


class AgentFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(method='filter_name')

    class Meta:
        model = Agent
        fields = ['status', 'matricule', 'name']

    def filter_name(self, queryset, name, value):
        return queryset.filter(Q(first_name__icontains=value) | Q(last_name__icontains=value))


class EquipementFilter(django_filters.FilterSet):
    class Meta:
        model = Equipement
        fields = ['type', 'status', 'condition', 'serial_number', 'imei']


class AffectationFilter(django_filters.FilterSet):
    assigned_at_after = django_filters.DateTimeFilter(field_name='assigned_at', lookup_expr='gte')
    assigned_at_before = django_filters.DateTimeFilter(field_name='assigned_at', lookup_expr='lte')

    class Meta:
        model = Affectation
        fields = ['agent', 'equipement', 'is_active', 'assigned_at_after', 'assigned_at_before']


class RestitutionFilter(django_filters.FilterSet):
    returned_at_after = django_filters.DateTimeFilter(field_name='returned_at', lookup_expr='gte')
    returned_at_before = django_filters.DateTimeFilter(field_name='returned_at', lookup_expr='lte')

    class Meta:
        model = Restitution
        fields = ['returned_at_after', 'returned_at_before', 'condition']


class IncidentFilter(django_filters.FilterSet):
    class Meta:
        model = Incident
        fields = ['incident_type', 'status', 'equipement', 'agent']
