from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Agent, Equipement, Affectation, Restitution, Incident, Log, AgentInvite
from .utils import generate_matricule
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import secrets


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'is_active',
            'password',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AgentSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    matricule = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=True)
    project_type = serializers.CharField(required=True)
    id_document = serializers.ImageField(required=True)

    class Meta:
        model = Agent
        fields = [
            'id',
            'user',
            'user_detail',
            'matricule',
            'first_name',
            'last_name',
            'phone',
            'email',
            'address',
            'id_number',
            'id_document',
            'project_type',
            'status',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        matricule = (validated_data.get('matricule') or '').strip()
        if not matricule:
            matricule = generate_matricule()
        validated_data['matricule'] = matricule
        return super().create(validated_data)


class EquipementSerializer(serializers.ModelSerializer):
    qr_code_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Equipement
        fields = [
            'id',
            'type',
            'serial_number',
            'imei',
            'status',
            'condition',
            'qr_code_image',
            'created_at',
            'updated_at',
        ]


class AffectationSerializer(serializers.ModelSerializer):
    equipement_detail = EquipementSerializer(source='equipement', read_only=True)
    agent_detail = AgentSerializer(source='agent', read_only=True)
    assigned_by_detail = UserSerializer(source='assigned_by', read_only=True)

    class Meta:
        model = Affectation
        fields = [
            'id',
            'equipement',
            'equipement_detail',
            'agent',
            'agent_detail',
            'assigned_by',
            'assigned_by_detail',
            'assigned_at',
            'expected_return_at',
            'signature',
            'equipement_photo',
            'notes',
            'is_active',
        ]
        read_only_fields = ['assigned_by']


class RestitutionSerializer(serializers.ModelSerializer):
    affectation_detail = AffectationSerializer(source='affectation', read_only=True)
    received_by_detail = UserSerializer(source='received_by', read_only=True)

    class Meta:
        model = Restitution
        fields = [
            'id',
            'affectation',
            'affectation_detail',
            'received_by',
            'received_by_detail',
            'returned_at',
            'condition',
            'notes',
            'equipement_photo',
        ]
        read_only_fields = ['received_by']


class IncidentSerializer(serializers.ModelSerializer):
    equipement_detail = EquipementSerializer(source='equipement', read_only=True)
    agent_detail = AgentSerializer(source='agent', read_only=True)
    reported_by_detail = UserSerializer(source='reported_by', read_only=True)

    class Meta:
        model = Incident
        fields = [
            'id',
            'equipement',
            'equipement_detail',
            'agent',
            'agent_detail',
            'reported_by',
            'reported_by_detail',
            'incident_type',
            'description',
            'status',
            'reported_at',
            'closed_at',
        ]
        read_only_fields = ['reported_by']


class LogSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Log
        fields = [
            'id',
            'user',
            'user_detail',
            'action',
            'target_type',
            'target_id',
            'details',
            'ip_address',
            'created_at',
        ]


class AgentInviteSerializer(serializers.ModelSerializer):
    link = serializers.SerializerMethodField()

    class Meta:
        model = AgentInvite
        fields = [
            'id',
            'token',
            'link',
            'email',
            'phone',
            'created_by',
            'created_at',
            'expires_at',
            'used_at',
            'notes',
        ]
        read_only_fields = ['token', 'created_by', 'created_at', 'used_at']

    def get_link(self, obj):
        base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
        return f"{base}/inscription/{obj.token}"

    def create(self, validated_data):
        token = secrets.token_urlsafe(32)
        validated_data['token'] = token
        if 'expires_at' not in validated_data:
            validated_data['expires_at'] = timezone.now() + timedelta(days=7)
        return super().create(validated_data)


class AgentSelfRegisterSerializer(serializers.Serializer):
    token = serializers.CharField()
    matricule = serializers.CharField(max_length=50, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(max_length=100)
    project_type = serializers.CharField(max_length=100)
    id_document = serializers.ImageField()
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=4)

    def validate(self, attrs):
        try:
            invite = AgentInvite.objects.get(token=attrs['token'])
        except AgentInvite.DoesNotExist as exc:
            raise serializers.ValidationError('Lien invalide.') from exc

        if invite.is_used():
            raise serializers.ValidationError('Lien deja utilise.')
        if invite.is_expired():
            raise serializers.ValidationError('Lien expire.')

        matricule = (attrs.get('matricule') or '').strip()
        if matricule:
            if Agent.objects.filter(matricule=matricule).exists():
                raise serializers.ValidationError('Matricule deja utilise.')
        else:
            matricule = generate_matricule()

        username = (attrs.get('username') or matricule).strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Nom d'utilisateur deja utilise.")

        attrs['invite'] = invite
        attrs['resolved_username'] = username
        attrs['resolved_matricule'] = matricule
        return attrs

    def create(self, validated_data):
        invite = validated_data['invite']
        username = validated_data['resolved_username']
        email = validated_data.get('email') or invite.email or ''
        phone = validated_data.get('phone') or invite.phone or ''
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            role=User.Role.AGENT,
            is_active=True,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
        )

        agent = Agent.objects.create(
            user=user,
            matricule=validated_data['resolved_matricule'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
            email=email,
            address=validated_data.get('address', ''),
            id_number=validated_data['id_number'],
            project_type=validated_data['project_type'],
            id_document=validated_data['id_document'],
            status=Agent.Status.ACTIVE,
        )

        invite.used_at = timezone.now()
        invite.save(update_fields=['used_at'])
        return agent


class AgentOpenRegisterSerializer(serializers.Serializer):
    matricule = serializers.CharField(max_length=50, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(max_length=100)
    project_type = serializers.CharField(max_length=100)
    id_document = serializers.ImageField()
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=4)

    def validate(self, attrs):
        matricule = (attrs.get('matricule') or '').strip()
        if matricule:
            if Agent.objects.filter(matricule=matricule).exists():
                raise serializers.ValidationError('Matricule deja utilise.')
        else:
            matricule = generate_matricule()

        username = (attrs.get('username') or matricule).strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Nom d'utilisateur deja utilise.")
        attrs['resolved_username'] = username
        attrs['resolved_matricule'] = matricule
        return attrs

    def create(self, validated_data):
        username = validated_data['resolved_username']
        email = validated_data.get('email', '')
        phone = validated_data.get('phone', '')
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            role=User.Role.AGENT,
            is_active=True,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
        )

        agent = Agent.objects.create(
            user=user,
            matricule=validated_data['resolved_matricule'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
            email=email,
            address=validated_data.get('address', ''),
            id_number=validated_data['id_number'],
            project_type=validated_data['project_type'],
            id_document=validated_data['id_document'],
            status=Agent.Status.ACTIVE,
        )

        return agent
