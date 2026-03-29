from pydantic import BaseModel, Field, TypeAdapter
from typing import Annotated, List, Optional, Union, Literal
from app.schemas.enums import LanguageEnum

#######################################################################
#######################################################################
class URLFilterRule(BaseModel):
    type: Literal["url"] = "url"
    patterns: List[str]
    reverse: bool = False

class DomainFilterRule(BaseModel):
    type: Literal["domain"] = "domain"
    allowed: List[str] = Field(default_factory=list)
    blocked: List[str] = Field(default_factory=list)

class SEOFilterRule(BaseModel):
    type: Literal["seo"] = "seo"
    keywords: List[str]
    threshold: float = 0.5

class RelevanceFilterRule(BaseModel):
    type: Literal["relevance"] = "relevance"
    query: str
    threshold: float = 0.7

FilterRule = Union[URLFilterRule, DomainFilterRule, SEOFilterRule, RelevanceFilterRule]

class CrawlingConfig(BaseModel):
    max_depth: int = Field(default=1, ge=1)
    max_pages: int = Field(default=10, ge=1)
    filters: List[FilterRule] = Field(default_factory=list)

class FilteringConfig(BaseModel):
    word_count_threshold: int = Field(default=30, ge=0)
    languages: Optional[List[LanguageEnum]] = Field(default=None)

class FormatingConfig(BaseModel):
    user_query: Optional[str] = Field(default=None)
    min_word_threshold: int = Field(default=20)
    threshold_type: Literal["fixed", "dynamic"] = Field(default="dynamic")
    threshold: float = Field(default=0.6, ge=0.0, le=1.0)
    ignore_links: bool = False
    ignore_images: bool = True
    skip_internal_links: bool = False

    excluded_tags: List[str] = Field(
        default=[
            "nav", "footer", "aside", "header",
            "#footer", ".footer", "#header", ".header",
            ".copyright", ".cookie-banner", "#cookie-banner",
            ".sidebar", "#sidebar", ".menu", "#menu"
        ]
    )

class URLJobConfig(BaseModel):
    type: Literal["url"] = "url"
    url: str
    crawling: Optional[CrawlingConfig] = None
    filtering: FilteringConfig = Field(default_factory=FilteringConfig)
    formating: FormatingConfig = Field(default_factory=FormatingConfig)

#######################################################################
#######################################################################
class PDFJobConfig(BaseModel):
    type: Literal["pdf"] = "pdf"
    storage_keys: List[str]
    bucket: str

#######################################################################
#######################################################################
JobConfig = Annotated[Union[URLJobConfig, PDFJobConfig], Field(discriminator="type")]
JobConfigAdapter = TypeAdapter(JobConfig)

#######################################################################
#######################################################################
class JobPageResult(BaseModel):
    url: str
    title: Optional[str] = None
    reason: Optional[str] = None
    error: Optional[str] = None

class JobSummary(BaseModel):
    total: int = 0
    succeeded: int = 0
    failed: int = 0
    skipped: int = 0

class URLJobResult(BaseModel):
    type: Literal["url"] = "url"
    failed: List[JobPageResult] = Field(default_factory=list)
    skipped: List[JobPageResult] = Field(default_factory=list)
    summary: JobSummary = Field(default_factory=JobSummary)

#######################################################################
#######################################################################
class PDFFileResult(BaseModel):
    key: str
    filename: str
    pages: int
    error: Optional[str] = None

class PDFJobResult(BaseModel):
    type: Literal["pdf"] = "pdf"
    files: List[PDFFileResult] = Field(default_factory=list)
    summary: JobSummary = Field(default_factory=JobSummary)

#######################################################################
#######################################################################
JobResult = Annotated[Union[URLJobResult, PDFJobResult], Field(discriminator="type")]
JobResultAdapter = TypeAdapter(JobResult)
