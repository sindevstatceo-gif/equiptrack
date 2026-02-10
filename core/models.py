from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.files.base import ContentFile
from django.utils import timezone
from io import BytesIO
import qrcode


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrateur'
        SUPERVISOR = 'SUPERVISOR', 'Superviseur'
        AGENT = 'AGENT', 'Agent'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT)
    phone = models.CharField(max_length=30, blank=True)

    def save(self, *args, **kwargs):
        if self.role == self.Role.ADMIN:
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Agent(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Actif'
        INACTIVE = 'INACTIVE', 'Inactif'

    user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_profile'
    )
    matricule = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    id_number = models.CharField(max_length=100, blank=True)
    id_document = models.ImageField(upload_to='id_documents/', blank=True, null=True)
    project_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.matricule} - {self.first_name} {self.last_name}"


class Equipement(models.Model):
    class Type(models.TextChoices):
        TABLETTE = 'TABLETTE', 'Tablette'
        CHARGEUR = 'CHARGEUR', 'Chargeur'
        POWERBANK = 'POWERBANK', 'Powerbank'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Disponible'
        ASSIGNED = 'ASSIGNED', 'Affecte'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        LOST = 'LOST', 'Perdu'
        RETIRED = 'RETIRED', 'Retire'

    class Condition(models.TextChoices):
        GOOD = 'GOOD', 'Bon'
        DAMAGED = 'DAMAGED', 'Endommage'
        NEEDS_REPAIR = 'NEEDS_REPAIR', 'A reparer'

    type = models.CharField(max_length=20, choices=Type.choices)
    serial_number = models.CharField(max_length=100, unique=True)
    imei = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.GOOD)
    qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_qr_code(self):
        data = f"EQUIPEMENT:{self.serial_number}"
        qr = qrcode.make(data)
        buffer = BytesIO()
        qr.save(buffer, format='PNG')
        filename = f"qr_{self.serial_number}.png"
        self.qr_code_image.save(filename, ContentFile(buffer.getvalue()), save=False)

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super().save(*args, **kwargs)
        if creating and not self.qr_code_image:
            self.generate_qr_code()
            super().save(update_fields=['qr_code_image'])

    def __str__(self):
        return f"{self.type} - {self.serial_number}"


class Affectation(models.Model):
    equipement = models.ForeignKey(
        Equipement, on_delete=models.PROTECT, related_name='affectations'
    )
    agent = models.ForeignKey(Agent, on_delete=models.PROTECT, related_name='affectations')
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='affectations_created'
    )
    assigned_at = models.DateTimeField(default=timezone.now)
    expected_return_at = models.DateTimeField(null=True, blank=True)
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True)
    equipement_photo = models.ImageField(upload_to='equipement_photos/', blank=True, null=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Affectation {self.id} - {self.equipement} -> {self.agent}"


class Restitution(models.Model):
    class Condition(models.TextChoices):
        GOOD = 'GOOD', 'Bon'
        DAMAGED = 'DAMAGED', 'Endommage'
        NEEDS_REPAIR = 'NEEDS_REPAIR', 'A reparer'

    affectation = models.OneToOneField(
        Affectation, on_delete=models.PROTECT, related_name='restitution'
    )
    received_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='restitutions_received'
    )
    returned_at = models.DateTimeField(default=timezone.now)
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.GOOD)
    notes = models.TextField(blank=True)
    equipement_photo = models.ImageField(upload_to='restitutions/', blank=True, null=True)

    def __str__(self):
        return f"Restitution {self.id} - {self.affectation.equipement}"


class Incident(models.Model):
    class Type(models.TextChoices):
        LOSS = 'LOSS', 'Perte'
        THEFT = 'THEFT', 'Vol'
        BREAKDOWN = 'BREAKDOWN', 'Panne'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Ouvert'
        CLOSED = 'CLOSED', 'Cloture'

    equipement = models.ForeignKey(
        Equipement, on_delete=models.PROTECT, related_name='incidents'
    )
    agent = models.ForeignKey(
        Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents'
    )
    reported_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents_reported'
    )
    incident_type = models.CharField(max_length=20, choices=Type.choices)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    reported_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Incident {self.id} - {self.get_incident_type_display()}"


class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    details = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.created_at:%Y-%m-%d %H:%M:%S}"


class AgentInvite(models.Model):
    token = models.CharField(max_length=64, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_invites'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_used(self):
        return self.used_at is not None

    def __str__(self):
        status = 'used' if self.is_used() else 'active'
        return f"Invite {self.token} ({status})"

