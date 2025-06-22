## IMPORTANT: This needs a .env with SUPABASE_URL, SUPABASE_KEY, and YOUTUBE_KEY

## ================ [ IMPORTS ] ================ ##

import os, re, time, pytz, schedule
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client
from googleapiclient.discovery import build

## ================ [ SETUP ] ================ ##

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
YOUTUBE_KEY = os.getenv("YOUTUBE_KEY")

# Initialize clients
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
youtube = build("youtube", "v3", developerKey=YOUTUBE_KEY)

# Youtube url regex
YOUTUBE_REGEX = re.compile(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})")

## ================ [ HELPERS ] ================ ##

def extract_video_id(url):
    match = YOUTUBE_REGEX.search(url)
    return match.group(1) if match else None

def get_channel_handle(channel_id):
    response = youtube.channels().list(
        part="snippet",
        id=channel_id
    ).execute()
    
    items = response.get("items", [])
    if not items:
        return None

    custom_url = items[0]["snippet"].get("customUrl", "")
    if custom_url.startswith("@"):
        return custom_url
    return f"@{custom_url}" if custom_url else None

def get_video_details(video_id):
    response = youtube.videos().list(
        part="snippet,statistics",
        id=video_id
    ).execute()
    
    items = response.get("items", [])
    if not items:
        return None

    snippet = items[0]["snippet"]
    stats = items[0]["statistics"]
    channel_id = snippet["channelId"]
    channel_handle = get_channel_handle(channel_id)

    return {
        "video_id": video_id,
        "title": snippet["title"],
        "date_published": snippet["publishedAt"][:10],
        "views": int(stats.get("viewCount", 0)),
        "channel": channel_handle
    }

def update_views_columns(video, current_views):
    publish_date = datetime.strptime(video["date_published"], "%Y-%m-%d").date()
    local_today = datetime.now().astimezone().date()
    days_since = (local_today - publish_date).days

    updates = {}

    if 1 <= days_since <= 30:
        column = f"views_{days_since}"
        if video.get(column) is None:
            updates[column] = current_views

    updates["views"] = current_views
    return updates

def update_video_data():
    creators = supabase.table("creator_instances").select("live_url").execute().data

    for creator in creators:
        url = creator.get("live_url")
        video_id = extract_video_id(url) if url else None
        if not video_id:
            continue

        existing = supabase.table("video_data").select("*").eq("video_id", video_id).execute().data

        if not existing:
            details = get_video_details(video_id)
            if not details:
                continue

            new_row = {
                "video_id": details["video_id"],
                "title": details["title"],
                "date_published": details["date_published"],
                "views": details["views"],
                "channel": details["channel"]
            }
            supabase.table("video_data").insert(new_row).execute()
        else:
            details = get_video_details(video_id)
            if not details:
                continue

            updates = update_views_columns(existing[0], details["views"])
            if updates:
                supabase.table("video_data").update(updates).eq("video_id", video_id).execute()

def job():
    print(f"Running update at {datetime.now(timezone.utc)} UTC")
    update_video_data()
    print("Update complete.")

## ================ [ SCHEDULER ] ================ ##

# Get local target time
timezone = datetime.now().astimezone().tzinfo
target_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
target_local = target_utc.astimezone(timezone)
target_local_str = target_local.strftime("%H:%M")

# Schedule job
schedule.every().day.at(target_local_str).do(job)

print(f"Scheduler started. Will run daily at {target_local_str} local time (equivalent to 00:00 UTC).")
while True:
    schedule.run_pending()
    time.sleep(30)
