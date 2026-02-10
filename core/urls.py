from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    AgentViewSet,
    EquipementViewSet,
    AffectationViewSet,
    RestitutionViewSet,
    IncidentViewSet,
    LogViewSet,
    ReportsView,
    AgentInviteViewSet,
    AgentRegistrationView,
    AgentOpenRegistrationView,
)


router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'agents', AgentViewSet, basename='agent')
router.register(r'equipements', EquipementViewSet, basename='equipement')
router.register(r'affectations', AffectationViewSet, basename='affectation')
router.register(r'restitutions', RestitutionViewSet, basename='restitution')
router.register(r'incidents', IncidentViewSet, basename='incident')
router.register(r'logs', LogViewSet, basename='log')
router.register(r'invites', AgentInviteViewSet, basename='invite')


urlpatterns = [
    path('agents/register/', AgentOpenRegistrationView.as_view(), name='agent-register'),
    path('invites/<str:token>/register/', AgentRegistrationView.as_view(), name='invite-register'),
    path('rapports/', ReportsView.as_view(), name='rapports'),
    path('', include(router.urls)),
]
