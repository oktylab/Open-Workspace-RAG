from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from app.core.security import decode_access_token
from app.api.dependencies.repositories import OrganizationRepositoryDep, WorkspaceRepositoryDep
from app.models.organization import Organization
from app.models.workspace import Workspace
from typing import Annotated

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/organizations/login")
api_key_scheme = APIKeyHeader(name="x-api-key")

#############################################################################
#############################################################################
async def get_current_organization(
    repo: OrganizationRepositoryDep,
    token: str = Depends(oauth2_scheme)
) -> Organization:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    org_id = decode_access_token(token)
    if not org_id:
        raise credentials_exception
        
    org = await repo.get_by_id(org_id)
    if not org:
        raise credentials_exception
        
    return org

CurrentOrgDep = Annotated[Organization, Depends(get_current_organization)]

#############################################################################
#############################################################################
async def get_current_workspace(
    db_org: CurrentOrgDep,
    repo: WorkspaceRepositoryDep,
    slug: str
) -> Workspace:
    db_workspace = await repo.get_by_slug_and_org(
        slug=slug,
        organization_id=db_org.id
    )

    if not db_workspace:
        raise HTTPException(404, "Workspace not found")
         
    return db_workspace

CurrentWorkspaceDep = Annotated[Workspace, Depends(get_current_workspace)]


#############################################################################
#############################################################################
async def get_public_workspace(
    request: Request,
    repo: WorkspaceRepositoryDep,
    api_key: str = Depends(api_key_scheme)
) -> Workspace:
    
    db_workspace = await repo.get_by_api_key(api_key)
    if not db_workspace:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid API Key"
        )

    origin = request.headers.get("origin")

    # FIXME : This is only for testing purposes, 
    # we should remove this in production and require the origin header 
    # to be set and validated against the allowed origins in the workspace settings
    if not origin : 
        return db_workspace
    
    if "*" in db_workspace.allowed_origins:
        return db_workspace

    if not origin or origin not in db_workspace.allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Domain not authorized"
        )
        
    return db_workspace

PublicWorkspaceDep = Annotated[Workspace, Depends(get_public_workspace)]