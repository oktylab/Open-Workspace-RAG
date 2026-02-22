from typing import List
from urllib.parse import urljoin, urlparse
from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext
from crawlee.http_clients import ImpitHttpClient
from crawlee import Request
from app.taskiq.broker import broker

#################################################################################
#################################################################################
def clean_url_string(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    path = parsed.path.rstrip('/') if parsed.path != '/' else '/'
    return f"{parsed.scheme}://{parsed.netloc}{path}"

#################################################################################
#################################################################################
@broker.task
async def crawl_site_task(url: str, max_pages: int = 100) -> List[str]:
    domain = urlparse(url).netloc
    
    unique_urls_found = set()

    http_client = ImpitHttpClient(verify=False)
    crawler = BeautifulSoupCrawler(http_client=http_client, max_requests_per_crawl=max_pages)

    @crawler.router.default_handler
    async def request_handler(context: BeautifulSoupCrawlingContext) -> None:
        actual_raw_url = context.request.loaded_url or context.request.url
        current_clean_url = clean_url_string(actual_raw_url)
        
        unique_urls_found.add(current_clean_url)

        for link in context.soup.find_all('a', href=True):
            full_url = urljoin(actual_raw_url, link['href'])
            parsed_link = urlparse(full_url)
            
            if parsed_link.netloc == domain:
                child_clean_url = clean_url_string(full_url)
                unique_urls_found.add(child_clean_url)

        await context.enqueue_links(
            strategy="same-hostname",
            forefront=False
        )

    initial_request = Request.from_url(
        url, headers={"User-Agent": "Mozilla/5.0"}
    )
    
    await crawler.run([initial_request])
    
    unique_urls_found.add(clean_url_string(url))    
    return list(unique_urls_found)