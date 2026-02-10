from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from PIL import Image
from io import BytesIO

from .models import Equipement


class APISmokeTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username='admin', password='admin123', role='ADMIN'
        )
        self.client = APIClient()
        token_resp = self.client.post(
            '/api/login/', {'username': 'admin', 'password': 'admin123'}, format='json'
        )
        self.assertEqual(token_resp.status_code, 200)
        access = token_resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_full_flow(self):
        buffer = BytesIO()
        Image.new('RGB', (1, 1), color='white').save(buffer, format='PNG')
        buffer.seek(0)

        agent_resp = self.client.post(
            '/api/agents/',
            {
                'matricule': 'AG-100',
                'first_name': 'Test',
                'last_name': 'Agent',
                'phone': '770000000',
                'email': 'agent@test.com',
                'id_number': 'CNI-123456',
                'project_type': 'Collecte',
                'id_document': SimpleUploadedFile(
                    'id.png', buffer.getvalue(), content_type='image/png'
                ),
                'status': 'ACTIVE',
            },
            format='multipart',
        )
        self.assertEqual(agent_resp.status_code, 201)
        agent_id = agent_resp.data['id']

        equip_resp = self.client.post(
            '/api/equipements/',
            {
                'type': 'TABLETTE',
                'serial_number': 'TB-TEST-001',
                'imei': '123456789012345',
                'status': 'AVAILABLE',
                'condition': 'GOOD',
            },
            format='json',
        )
        self.assertEqual(equip_resp.status_code, 201)
        equip_id = equip_resp.data['id']

        affect_resp = self.client.post(
            '/api/affectations/',
            {
                'equipement': equip_id,
                'agent': agent_id,
                'assigned_at': '2026-02-01T10:00:00Z',
                'expected_return_at': '2026-06-01T10:00:00Z',
                'is_active': True,
            },
            format='json',
        )
        self.assertEqual(affect_resp.status_code, 201)
        affect_id = affect_resp.data['id']

        equipement = Equipement.objects.get(pk=equip_id)
        self.assertEqual(equipement.status, Equipement.Status.ASSIGNED)
        self.assertTrue(bool(equipement.qr_code_image))

        restitution_resp = self.client.post(
            '/api/restitutions/',
            {
                'affectation': affect_id,
                'returned_at': '2026-02-10T10:00:00Z',
                'condition': 'GOOD',
                'notes': 'Retour OK',
            },
            format='json',
        )
        self.assertEqual(restitution_resp.status_code, 201)

        equipement.refresh_from_db()
        self.assertEqual(equipement.status, Equipement.Status.AVAILABLE)

        incident_resp = self.client.post(
            '/api/incidents/',
            {
                'equipement': equip_id,
                'agent': agent_id,
                'incident_type': 'BREAKDOWN',
                'description': 'Panne mineure',
                'status': 'OPEN',
                'reported_at': '2026-02-11T10:00:00Z',
            },
            format='json',
        )
        self.assertEqual(incident_resp.status_code, 201)

        report_resp = self.client.get('/api/rapports/')
        self.assertEqual(report_resp.status_code, 200)

