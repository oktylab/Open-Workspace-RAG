from sqlalchemy.dialects import postgresql
import sqlalchemy.types as types
from pydantic import TypeAdapter

class PydanticType(types.TypeDecorator):
    impl = postgresql.JSONB
    cache_ok = True

    def __init__(self, pydantic_type=None, **kwargs):
        super().__init__(**kwargs)
        self.pydantic_type = pydantic_type

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, dict):
            return value
        return value.model_dump(mode="json")

    def process_result_value(self, value, dialect):
        if value is None or self.pydantic_type is None:
            return value
        if isinstance(self.pydantic_type, TypeAdapter):
            if isinstance(value, dict) and "type" not in value:
                value = {"type": "url", **value}
            return self.pydantic_type.validate_python(value)
        return self.pydantic_type.model_validate(value)


class PydanticListType(types.TypeDecorator):
    """Stores a list of Pydantic model instances as a JSONB array."""
    impl = postgresql.JSONB
    cache_ok = True

    def __init__(self, pydantic_type=None, **kwargs):
        super().__init__(**kwargs)
        self.pydantic_type = pydantic_type

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return [item.model_dump(mode="json") for item in value]

    def process_result_value(self, value, dialect):
        if value is None:
            return []
        if self.pydantic_type is None:
            return value
        return [self.pydantic_type.model_validate(item) for item in value]