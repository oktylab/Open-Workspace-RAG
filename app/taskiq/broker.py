from taskiq_redis import RedisAsyncResultBackend, ListQueueBroker, RedisScheduleSource
from taskiq import TaskiqScheduler
from app.core.secrets import secrets

#####################################################################################
#####################################################################################
result_backend = RedisAsyncResultBackend(
    redis_url=f"redis://{secrets.REDIS_HOST}:{secrets.REDIS_PORT}/0"
)

#####################################################################################
#####################################################################################
broker = (
    ListQueueBroker(url=f"redis://{secrets.REDIS_HOST}:{secrets.REDIS_PORT}/0")
    .with_result_backend(result_backend)
)

#####################################################################################
#####################################################################################
redis_source = RedisScheduleSource(
    f"redis://{secrets.REDIS_HOST}:{secrets.REDIS_PORT}/0"
)

#####################################################################################
#####################################################################################
scheduler = TaskiqScheduler(
    broker=broker, 
    sources=[redis_source]
)