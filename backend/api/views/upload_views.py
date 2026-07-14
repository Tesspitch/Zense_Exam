import os
import uuid
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

@csrf_exempt
def upload_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        role = decoded.get('role')
        if role != 'Teacher':
            return JsonResponse({'error': 'Forbidden'}, status=403)
    except Exception:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image file provided'}, status=400)

    image_file = request.FILES['image']
    
    # Generate unique filename to prevent overrides
    ext = os.path.splitext(image_file.name)[1]
    if not ext:
        ext = '.png'
        
    unique_filename = f"uploads/{uuid.uuid4().hex}{ext}"
    
    try:
        file_path = default_storage.save(unique_filename, ContentFile(image_file.read()))
        # Manually construct URL to ensure it starts with /media/
        file_url = f"{settings.MEDIA_URL}{file_path}"
        # Make sure url is properly formatted
        file_url = file_url.replace('\\', '/')
        return JsonResponse({'url': f"http://localhost:8000{file_url}"}, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Upload Error: {str(e)}'}, status=500)
