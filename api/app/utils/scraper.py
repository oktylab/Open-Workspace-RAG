from typing import List
from app.schemas.job_params import URLJobConfig as JobConfig

from crawl4ai import (
    AsyncWebCrawler, CrawlerRunConfig, DefaultMarkdownGenerator, 
    PruningContentFilter, BFSDeepCrawlStrategy, CacheMode, 
    LXMLWebScrapingStrategy, CrawlResult, BrowserConfig,
    URLPatternFilter, FilterChain, DomainFilter, 
    SEOFilter, ContentRelevanceFilter, ContentTypeFilter, BM25ContentFilter,
)

################################################################################
################################################################################
def get_browser_config() -> BrowserConfig:
    return BrowserConfig(
        browser_type="chromium",
        # cdp_url="ws://browser:3000", 
        verbose=False,
        enable_stealth=True,
        user_agent_mode="random",
        ignore_https_errors=True,
        use_persistent_context=False,
        headless=True,
        extra_args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    )


################################################################################
################################################################################
async def scrape_deep_crawl(config: JobConfig) -> List[CrawlResult]:
    strategy = None
    if config.crawling:
        filter_instances = []

        for rule in config.crawling.filters:
            if rule.type == "url":
                filter_instances.append(URLPatternFilter(patterns=rule.patterns, reverse=rule.reverse))
            
            elif rule.type == "domain":
                filter_instances.append(DomainFilter(allowed_domains=rule.allowed, blocked_domains=rule.blocked))
            
            elif rule.type == "seo":
                filter_instances.append(SEOFilter(threshold=rule.threshold, keywords=rule.keywords))
            
            elif rule.type == "relevance":
                filter_instances.append(ContentRelevanceFilter(query=rule.query, threshold=rule.threshold))

            elif rule.type == "type":
                filter_instances.append(ContentTypeFilter(allowed_types=rule.allowed_types, check_extension=rule.check_extension))
        
        if not filter_instances:
            filter_instances.append(URLPatternFilter(patterns=["*"]))

        strategy = BFSDeepCrawlStrategy(
            max_depth=config.crawling.max_depth, 
            max_pages=config.crawling.max_pages,
            include_external=False, 
            filter_chain=FilterChain(filter_instances)
        )


    selector_string = ", ".join(config.formating.excluded_tags) if config.formating.excluded_tags else None

    arun_config = CrawlerRunConfig(
        deep_crawl_strategy=strategy,
        excluded_tags=None,
        excluded_selector=selector_string,
        markdown_generator=DefaultMarkdownGenerator(
            content_filter=PruningContentFilter(
                user_query=config.formating.user_query,
                threshold=config.formating.threshold,
                threshold_type=config.formating.threshold_type,
                min_word_threshold=config.formating.min_word_threshold,
            ),
            options={
                "ignore_links": config.formating.ignore_links, 
                "ignore_images": config.formating.ignore_images, 
                "skip_internal_links": config.formating.skip_internal_links
            }
        ),
        remove_forms=True,
        remove_overlay_elements=True,
        prettiify=True,
        scraping_strategy=LXMLWebScrapingStrategy(),

        semaphore_count=5,            # Limit to 1 (max 2) concurrent pages. Default is 5.
        mean_delay=2.0,               # Wait ~2 seconds between actions/fetches
        max_range=1.0,                # Randomize the delay by +/- 1 second
        delay_before_return_html=1.0, # Give the page 1 extra second to settle before extracting
        
        magic=True,                   # Crawl4AI's built-in anti-bot presets
        simulate_user=True,           # Simulates human mouse movements and scrolling
        override_navigator=True,      # Overrides navigator object properties to hide automation
        page_timeout=60000,
        wait_until="domcontentloaded",
        cache_mode=CacheMode.BYPASS,
        verbose=True,
    )

    async with AsyncWebCrawler(config=get_browser_config()) as crawler:
        result = await crawler.arun(
            url=config.url,
            config=arun_config
        )
        return result if isinstance(result, list) else [result]