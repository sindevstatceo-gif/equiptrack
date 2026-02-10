from rest_framework.permissions import BasePermission, SAFE_METHODS


def _is_admin(user):
    return getattr(user, 'is_superuser', False) or getattr(user, 'role', None) == 'ADMIN'


def _is_supervisor(user):
    return getattr(user, 'role', None) == 'SUPERVISOR'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and _is_admin(request.user)
    
    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_authenticated and _is_admin(request.user)


class IsAdminOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            _is_admin(request.user) or _is_supervisor(request.user)
        )

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_authenticated and (
            _is_admin(request.user) or _is_supervisor(request.user)
        )


class IsAdminOrSupervisorOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (
            _is_admin(request.user) or _is_supervisor(request.user)
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (
            _is_admin(request.user) or _is_supervisor(request.user)
        )
