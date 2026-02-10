from .models import Log
from .utils import get_client_ip


class AuditLogMixin:
    action_create = 'CREATE'
    action_update = 'UPDATE'
    action_delete = 'DELETE'

    def _log_action(self, request, action, instance, details=None):
        Log.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            target_type=instance.__class__.__name__,
            target_id=str(instance.pk),
            details=details or {},
            ip_address=get_client_ip(request),
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(self.request, self.action_create, instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_action(self.request, self.action_update, instance)

    def perform_destroy(self, instance):
        self._log_action(self.request, self.action_delete, instance)
        instance.delete()
