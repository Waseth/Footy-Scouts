import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app


def init_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=app.config['CLOUDINARY_API_KEY'],
        api_secret=app.config['CLOUDINARY_API_SECRET'],
        secure=True,
    )


class CloudinaryService:

    UPLOAD_PRESETS = {
        'profile_picture': {'folder': 'footy_scout/profiles', 'transformation': [{'width': 400, 'height': 400, 'crop': 'fill'}]},
        'logo': {'folder': 'footy_scout/logos', 'transformation': [{'width': 300, 'height': 300, 'crop': 'fill'}]},
        'player_video': {'folder': 'footy_scout/videos', 'resource_type': 'video'},
        'player_photo': {'folder': 'footy_scout/photos'},
        'player_cv': {'folder': 'footy_scout/cvs', 'resource_type': 'raw'},
        'message_attachment': {'folder': 'footy_scout/attachments'},
    }

    @staticmethod
    def upload_image(file_stream, upload_type='profile_picture', public_id=None):
        """Upload an image to Cloudinary."""
        try:
            options = {**CloudinaryService.UPLOAD_PRESETS.get(upload_type, {})}
            if public_id:
                options['public_id'] = public_id

            result = cloudinary.uploader.upload(
                file_stream,
                **options
            )
            return {
                'url': result['url'],
                'secure_url': result['secure_url'],
                'public_id': result['public_id'],
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'file_size': result.get('bytes'),
                'original_filename': result.get('original_filename'),
            }
        except Exception as e:
            raise Exception(f"Cloudinary upload failed: {str(e)}")

    @staticmethod
    def upload_video(file_stream, upload_type='player_video', public_id=None):
        """Upload a video to Cloudinary."""
        try:
            options = {
                **CloudinaryService.UPLOAD_PRESETS.get(upload_type, {}),
                'resource_type': 'video',
            }
            if public_id:
                options['public_id'] = public_id

            result = cloudinary.uploader.upload(file_stream, **options)
            return {
                'url': result['url'],
                'secure_url': result['secure_url'],
                'public_id': result['public_id'],
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'file_size': result.get('bytes'),
                'duration': result.get('duration'),
                'original_filename': result.get('original_filename'),
            }
        except Exception as e:
            raise Exception(f"Cloudinary video upload failed: {str(e)}")

    @staticmethod
    def upload_raw(file_stream, upload_type='player_cv', public_id=None):
        """Upload a raw file (PDF) to Cloudinary."""
        try:
            options = {
                **CloudinaryService.UPLOAD_PRESETS.get(upload_type, {}),
                'resource_type': 'raw',
            }
            if public_id:
                options['public_id'] = public_id

            result = cloudinary.uploader.upload(file_stream, **options)
            return {
                'url': result['url'],
                'secure_url': result['secure_url'],
                'public_id': result['public_id'],
                'file_size': result.get('bytes'),
                'original_filename': result.get('original_filename'),
            }
        except Exception as e:
            raise Exception(f"Cloudinary file upload failed: {str(e)}")

    @staticmethod
    def delete_file(public_id: str, resource_type: str = 'image'):
        """Delete a file from Cloudinary."""
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result.get('result') == 'ok'
        except Exception as e:
            raise Exception(f"Cloudinary deletion failed: {str(e)}")

    @staticmethod
    def validate_file_type(filename: str, allowed_types: set) -> bool:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in allowed_types