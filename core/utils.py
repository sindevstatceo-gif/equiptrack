def get_client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def generate_matricule(prefix='AG'):
    from django.utils import timezone
    import secrets
    from .models import Agent

    base = timezone.now().strftime(f"{prefix}%Y%m%d")
    for _ in range(100):
        candidate = f"{base}{secrets.randbelow(10000):04d}"
        if not Agent.objects.filter(matricule=candidate).exists():
            return candidate
    raise RuntimeError('Impossible de generer un matricule unique.')
