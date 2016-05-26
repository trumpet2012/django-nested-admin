import glob
import os
import tempfile

import django


current_dir = os.path.abspath(os.path.dirname(__file__))
temp_dir = tempfile.mkdtemp()


DEBUG = NESTED_ADMIN_DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:'
    }
}
SECRET_KEY = 'z-i*xqqn)r0i7leak^#clq6y5j8&tfslp^a4duaywj2$**s*0_'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [os.path.join(current_dir, 'templates')],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.contrib.auth.context_processors.auth',
            'django.template.context_processors.debug',
            'django.template.context_processors.i18n',
            'django.template.context_processors.media',
            'django.template.context_processors.static',
            'django.template.context_processors.tz',
            'django.template.context_processors.request',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

try:
    import grappelli
except ImportError:
    try:
        import suit
    except ImportError:
        INSTALLED_APPS = tuple([])
    else:
        INSTALLED_APPS = tuple(['suit'])
        SUIT_CONFIG = {'CONFIRM_UNSAVED_CHANGES': False}
else:
    INSTALLED_APPS = tuple(['grappelli'])

INSTALLED_APPS += (
    'nested_admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.staticfiles',
    'django.contrib.admin',
)

# Add apps within the tests folder
for p in glob.glob(os.path.join(current_dir, '*', 'models.py')):
    INSTALLED_APPS += tuple(["nested_admin.tests.%s" %
        os.path.basename(os.path.dirname(p))])


if django.VERSION >= (1, 10):
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]
else:
    MIDDLEWARE_CLASSES = (
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    )

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'nested_admin.tests': {
            'handlers': ['console'],
            'level': os.getenv('NESTED_ADMIN_LOG_LEVEL', 'WARNING'),
        },
    },
}

SITE_ID = 1
FIXTURE_DIRS = [os.path.join(current_dir, 'fixtures')]
ROOT_URLCONF = 'nested_admin.tests.urls'
MEDIA_ROOT = os.path.join(temp_dir, 'media')
MEDIA_URL = '/media/'
STATIC_URL = '/static/'
DEBUG_PROPAGATE_EXCEPTIONS = True
TEST_RUNNER = 'django.test.runner.DiscoverRunner'
