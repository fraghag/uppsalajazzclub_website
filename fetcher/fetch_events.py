import os
import json
import requests
import typer
import time
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path

app = typer.Typer(help="Fetch events from Facebook Page.")

def get_iso_date(date_str: str) -> Optional[datetime]:
    """Parses YYYY-MM-DD into a datetime object (start of day)."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        typer.echo(f"Error: Invalid date format '{date_str}'. Use YYYY-MM-DD.", err=True)
        return None

def download_image(url: str, save_path: Path) -> bool:
    """Downloads an image from a URL and saves it to the specified path."""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        typer.echo(f"Warning: Failed to download image from {url}: {e}", err=True)
        return False

@app.command()
def main(
    since: Optional[str] = typer.Option(
        None, 
        "--since", 
        help="Fetch historical events since this date (YYYY-MM-DD)"
    )
):
    """
    Fetch events and their cover images from a Facebook Page.
    """
    access_token = os.environ.get('FB_PAGE_ACCESS_TOKEN')
    page_id = os.environ.get('FB_PAGE_ID')
    
    if not access_token or not page_id:
        typer.echo("Error: FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID environment variables are required.", err=True)
        raise typer.Exit(code=1)

    url = f"https://graph.facebook.com/v19.0/{page_id}/events"
    params = {
        'access_token': access_token,
        'fields': 'id,name,start_time,end_time,place,description,cover',
        'limit': 100 # Request more per page for historical fetches
    }

    since_dt = None
    if since:
        since_dt = get_iso_date(since)
        if since_dt is None:
            raise typer.Exit(code=1)
        # We still pass 'since' to the API to limit the initial search, 
        # but we will also filter client-side to be sure.
        params['since'] = int(since_dt.timestamp())
        typer.echo(f"Fetching historical events since {since}...")
    else:
        params['time_filter'] = 'upcoming'
        typer.echo(f"Fetching upcoming events...")

    fetched_events = []
    
    # Setup image directory
    img_dir = Path('website/data/event_images')
    img_dir.mkdir(parents=True, exist_ok=True)

    try:
        while url:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            events = data.get('data', [])
            
            for event in events:
                event_id = event['id']
                start_time_str = event.get('start_time', '')
                
                # CLIENT-SIDE FILTERING:
                # Facebook API 'since' parameter is notoriously unreliable and often returns 
                # events from years ago. We strictly enforce the filter here.
                if since_dt and start_time_str:
                    try:
                        event_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                        if event_dt < since_dt:
                            # Skip this event as it's older than our 'since' date
                            continue
                    except ValueError:
                        pass

                # Format image name: YYYYMMDD_ID.jpg
                img_path_json = None
                if 'cover' in event and 'source' in event['cover']:
                    img_url = event['cover']['source']
                    date_prefix = "no-date"
                    if start_time_str:
                        try:
                            dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                            date_prefix = dt.strftime("%Y%m%d")
                        except ValueError:
                            pass
                    
                    img_filename = f"{date_prefix}_{event_id}.jpg"
                    local_img_path = img_dir / img_filename
                    
                    if not local_img_path.exists():
                        typer.echo(f"Downloading image for event {event_id}...")
                        if download_image(img_url, local_img_path):
                            img_path_json = f"data/event_images/{img_filename}"
                    else:
                        img_path_json = f"data/event_images/{img_filename}"

                event_url = f"https://www.facebook.com/events/{event_id}"
                
                processed_event = {
                    'id': event_id,
                    'name': event.get('name'),
                    'start_time': start_time_str,
                    'end_time': event.get('end_time'),
                    'place': event.get('place', {}).get('name') if isinstance(event.get('place'), dict) else event.get('place'),
                    'description': event.get('description'),
                    'url': event_url,
                    'image': img_path_json
                }
                fetched_events.append(processed_event)
            
            url = data.get('paging', {}).get('next')
            params = {} 

        output_path = Path('website/data/events.json')
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        existing_events = []
        if output_path.exists():
            try:
                with open(output_path, 'r', encoding='utf-8') as f:
                    existing_events = json.load(f)
            except (json.JSONDecodeError, IOError):
                typer.echo(f"Warning: Could not read existing events from {output_path}. Starting fresh.", err=True)

        all_events_dict = {e['id']: e for e in existing_events}
        for event in fetched_events:
            all_events_dict[event['id']] = event
            
        merged_events = list(all_events_dict.values())
        merged_events.sort(key=lambda x: x.get('start_time', ''), reverse=False)
        
        # FINAL SANITY CHECK:
        # If the user specified 'since', we should also ensure the existing archive 
        # doesn't contain events older than 2014 if they ran a bad fetch before.
        # Actually, let's just trust the merge and the user can delete the file if they want to reset.
        # But we will only add the *newly fetched* events that pass the filter.
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(merged_events, f, ensure_ascii=False, indent=2)
            
        typer.echo(f"Successfully fetched {len(fetched_events)} events.")
        typer.echo(f"Merged total: {len(merged_events)} events saved to {output_path}.")
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 400:
            typer.echo(f"Error: Facebook API returned a 400 Bad Request.", err=True)
            typer.echo(f"Details: {e.response.text}", err=True)
        else:
            typer.echo(f"HTTP Error: {e}", err=True)
        raise typer.Exit(code=1)
    except Exception as e:
        typer.echo(f"An unexpected error occurred: {e}", err=True)
        raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
