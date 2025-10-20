from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activities
    assert 'Chess Club' in data


def test_signup_and_unregister_cycle():
    activity = 'Chess Club'
    email = 'testuser@example.com'

    # Ensure not already present
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    if email in participants:
        # remove first to ensure a clean state
        client.delete(f"/activities/{activity}/participants?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200

    # Check present
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email in participants

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200

    # Check removed
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email not in participants
