#!/usr/bin/env python3
"""
Infrastructure Diagram Generator for Nowhere Land Blog
Generates a visual representation of the complete infrastructure architecture
"""

from diagrams import Diagram, Edge, Cluster
from diagrams.aws.analytics import AmazonOpensearchService
from diagrams.programming.framework import React
from diagrams.onprem.database import Postgresql
from diagrams.generic.network import Firewall
from diagrams.generic.storage import Storage
from diagrams.onprem.ci import GithubActions
from diagrams.onprem.vcs import Github
from diagrams.programming.framework import Vercel
from diagrams.custom import Custom
from diagrams.oci.connectivity import DNS
from diagrams.onprem.client import User


# Custom icons for services not available in diagrams
class Supabase(Custom):
    def __init__(self, label):
        super().__init__(label, "./image/supabase.png")

class Claude(Custom):
    def __init__(self, label):
        super().__init__(label, "./image/claude.png")

def create_infrastructure_diagram():
    """Generate the complete infrastructure diagram"""
    
    with Diagram("Nowhere Land Blog - Infrastructure Architecture", 
                 show=False, 
                 direction="TB",
                 filename="infrastructure/diagram/nowhereland_infrastructure"):
        
        # Users and CDN Layer
        with Cluster("Users & CDN"):
            users = User("Users")
            cdn = Supabase("Supabase CDN")
            
        # Frontend Layer
        with Cluster("Frontend (Vercel)"):
            nextjs = React("Next.js App")
            vercel = Vercel("Vercel Platform")
            
        # API Gateway Layer
        with Cluster("API Gateway"):
            supabase_api = Supabase("Supabase API Gateway")
            auth = Firewall("Authentication")
            
        # Core Services Layer
        with Cluster("Core Services"):
            # Database cluster
            with Cluster("Database"):
                postgres = Postgresql("PostgreSQL")
                storage = Storage("File Storage")
                
            # Edge Functions cluster
            with Cluster("Edge Functions (Deno)"):
                media_fn = Supabase("Media Transform")
                ai_fn = Supabase("AI Orchestrator") 
                search_fn = Supabase("Search Service")
                webhook_fn = Supabase("Webhooks")
                
        # External Services Layer
        with Cluster("External Services"):
            # AI Services
            with Cluster("AI Services"):
                openai = Claude("Claude API(Haiku 3)")
                
            # Search Services
            with Cluster("Search"):
                opensearch = AmazonOpensearchService("AWS OpenSearch")
                pg_search = Postgresql("PostgreSQL FTS")
                
        # Analytics & Monitoring
        with Cluster("Analytics & Monitoring"):
            vercel_analytics = Vercel("Vercel Analytics")
            
        # Data Flow Connections
        users >> Edge(label="HTTPS") >> cdn
        cdn >> Edge(label="Static Assets") >> nextjs
        nextjs >> Edge(label="API Calls") >> supabase_api
        
        supabase_api >> Edge(label="Auth") >> auth
        supabase_api >> Edge(label="Data") >> postgres
        supabase_api >> Edge(label="Files") >> storage
        
        # Edge Functions connections
        supabase_api >> Edge(label="Process") >> media_fn
        supabase_api >> Edge(label="Generate") >> ai_fn
        supabase_api >> Edge(label="Search") >> search_fn
        supabase_api >> Edge(label="Events") >> webhook_fn
        
        # AI Services connections
        ai_fn >> Edge(label="Generate Tags/Abstract") >> openai
        
        # Search connections
        search_fn >> Edge(label="Primary") >> opensearch
        search_fn >> Edge(label="Fallback") >> pg_search
        
        # Analytics connections
        nextjs >> Edge(label="Metrics") >> vercel_analytics

def create_data_flow_diagram():
    """Generate a data flow diagram"""
    
    with Diagram("Data Flow - Blog Post Creation & Serving", 
                 show=False, 
                 direction="LR",
                 filename="infrastructure/diagram/data_flow"):
        
        # Content Creation Flow
        with Cluster("Content Creation"):
            admin = User("Admin User")
            write_ui = React("Post Editor")
            
        # Processing Pipeline
        with Cluster("Processing Pipeline"):
            content_api = DNS("Content API")
            ai_processor = Supabase("AI Processing")
            image_processor = Supabase("Image Processing")
            
        # Storage Layer
        with Cluster("Storage & Indexing"):
            db = Postgresql("Database")
            files = Storage("File Storage")
            search_index = AmazonOpensearchService("Search Index")
            
        # Content Delivery
        with Cluster("Content Delivery"):
            api = DNS("Public API")
            cdn_cache = Supabase("CDN Cache")
            reader = User("Blog Readers")
            
        # Data flows
        admin >> Edge(label="1. Create Post") >> write_ui
        write_ui >> Edge(label="2. Submit") >> content_api
        content_api >> Edge(label="3. Process AI") >> ai_processor
        content_api >> Edge(label="4. Process Images") >> image_processor
        
        ai_processor >> Edge(label="5. Store Content") >> db
        image_processor >> Edge(label="6. Store Files") >> files
        content_api >> Edge(label="7. Index") >> search_index
        
        reader >> Edge(label="8. Request") >> api
        api >> Edge(label="9. Fetch") >> db
        api >> Edge(label="10. Cache") >> cdn_cache
        cdn_cache >> Edge(label="11. Serve") >> reader

def create_deployment_diagram():
    """Generate deployment environments diagram"""
    
    with Diagram("Deployment Environments", 
                 show=False, 
                 direction="TB",
                 filename="infrastructure/diagram/deployment_environments"):
        
        # Development Environment
        with Cluster("Development Environment"):
            dev_frontend = React("localhost:3000")
            dev_supabase = Supabase("Supabase Free")
            dev_pg = Postgresql("PostgreSQL\n(Free Tier)")
            
        # Staging Environment  
        with Cluster("Staging Environment"):
            staging_vercel = DNS("staging.nowhereland.com")
            staging_supabase = Supabase("Supabase Pro")
            staging_opensearch = AmazonOpensearchService("OpenSearch t3.small")
            
        # Production Environment
        with Cluster("Production Environment"):
            prod_vercel = DNS("nowhereland.com")
            prod_supabase = Supabase("Supabase Pro")
            prod_opensearch = AmazonOpensearchService("OpenSearch t3.small")
            prod_monitoring = Vercel("Full Monitoring")
            
        # CI/CD Pipeline
        with Cluster("CI/CD Pipeline"):
            github = Github("GitHub")
            actions = GithubActions("GitHub Actions")
            
        # Deployment flows
        github >> Edge(label="Push") >> actions
        actions >> Edge(label="Auto Deploy") >> staging_vercel
        actions >> Edge(label="Manual Deploy") >> prod_vercel

if __name__ == "__main__":
    print("Generating infrastructure diagrams...")
    
    try:
        create_infrastructure_diagram()
        print("✅ Infrastructure diagram generated: infrastructure/diagram/nowhereland_infrastructure.png")
        
        create_data_flow_diagram()
        print("✅ Data flow diagram generated: infrastructure/diagram/data_flow.png")
        
        create_deployment_diagram()
        print("✅ Deployment diagram generated: infrastructure/diagram/deployment_environments.png")
        
        print("\n🎉 All diagrams generated successfully!")
        print("\nTo view the diagrams:")
        print("1. Install diagrams: pip install diagrams")
        print("2. Run this script: python generate_diagram.py")
        print("3. View PNG files in the infrastructure/diagram/ directory")
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("\n📦 To install required dependencies:")
        print("pip install diagrams")
        print("# For additional icons (optional):")
        print("sudo apt-get install graphviz  # On Ubuntu/Debian")
        print("brew install graphviz          # On macOS")
        
    except Exception as e:
        print(f"❌ Error generating diagrams: {e}")
        print("Make sure you have graphviz installed and the diagrams library is available.")