import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..services.profile_service import ProfileService


def _decode_auth(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, JsonResponse({'error': 'Unauthorized'}, status=401)
    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return decoded, None
    except jwt.ExpiredSignatureError:
        return None, JsonResponse({'error': 'Session expired'}, status=401)
    except Exception:
        return None, JsonResponse({'error': 'Invalid token'}, status=401)

# --- สำหรับนักเรียน ---
@csrf_exempt
def student_profile_api(request):
    if request.method == 'GET':
        decoded, err = _decode_auth(request)
        if err:
            return err
        user_id = decoded.get('user_id')
        role = decoded.get('role')
        data = ProfileService.get_profile_by_identity(user_id, role)
        if data is None:
            return JsonResponse({'error': 'Profile not found'}, status=404)
        return JsonResponse(data)
    
    if request.method == 'PUT':
        decoded, err = _decode_auth(request)
        if err:
            return err
        user_id = decoded.get('user_id')
        role = decoded.get('role')
        body = json.loads(request.body)
        success, msg = ProfileService.update_profile_by_identity(user_id, role, body)
        return JsonResponse({'message': msg} if success else {'error': msg}, status=200 if success else 400)

# --- สำหรับอาจารย์ ---
@csrf_exempt
def teacher_profile_api(request):
    if request.method == 'GET':
        decoded, err = _decode_auth(request)
        if err:
            return err
        user_id = decoded.get('user_id')
        role = decoded.get('role')
        data = ProfileService.get_profile_by_identity(user_id, role)
        if data is None:
            return JsonResponse({'error': 'Profile not found'}, status=404)
        return JsonResponse(data)
    
    if request.method == 'PUT':
        decoded, err = _decode_auth(request)
        if err:
            return err
        user_id = decoded.get('user_id')
        role = decoded.get('role')
        body = json.loads(request.body)
        success, msg = ProfileService.update_profile_by_identity(user_id, role, body)
        return JsonResponse({'message': msg} if success else {'error': msg}, status=200 if success else 400)

# --- ใช้ร่วมกันได้ (เปลี่ยนรหัสผ่าน) ---
@csrf_exempt
def common_change_password(request):
    if request.method == 'POST':
        decoded, err = _decode_auth(request)
        if err:
            return err
        user_id = decoded.get('user_id')
        role = decoded.get('role')
        body = json.loads(request.body)
        success, msg = ProfileService.change_password_by_identity(user_id, role, body.get('old_password'), body.get('new_password'))
        return JsonResponse({'message': msg} if success else {'error': msg}, status=200 if success else 400)