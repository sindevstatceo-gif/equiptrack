from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Agent, Equipement, Affectation, Restitution, Incident, Log, AgentInvite


User = get_user_model()
admin.site.register(User)
admin.site.register(Agent)
admin.site.register(Equipement)
admin.site.register(Affectation)
admin.site.register(Restitution)
admin.site.register(Incident)
admin.site.register(Log)
admin.site.register(AgentInvite)

