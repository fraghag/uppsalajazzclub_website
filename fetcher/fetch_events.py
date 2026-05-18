import os
import json
import requests
import typer
import time
from datetime import datetime
from typing import Optional
from pathlib import Path

app = typer.Typer(help="Fetch events from Facebook Page.")

def get_unix_timestamp(date_str: str) -> Optional[int]:
    """Converts YYYY-MM-DD to a Unix timestamp."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return int(time.mktime(dt.timetuple()))
    except ValueError:
        typer.echo(f"Error: Invalid date format '{date_str}'. Use YYYY-MM-DD.", err=True)
        return None

@app.command()
def main(
    since: Optional[str] = typer.Option(
        None, 
        "--since", 
        help="Fetch historical events since this date (YYYY-MM-DD)"
    )
):
    """
    Fetch events from a Facebook Page and save them to website/data/events.json.
    """
    access_token = os.environ.get('FB_PAGE_ACCESS_TOKEN')
    page_id = os.environ.get('FB_PAGE_ID')
    
    if not access_token or not page_id:
        typer.echo("Error: FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID environment variables are required.", err=True)
        raise typer.Exit(code=1)

    url = f"https://graph.facebook.com/v19.0/{page_id}/events"
    params = {
        'access_token': access_token,
        'fields': 'id,name,start_time,end_time,place,description'
    }

    if since:
        timestamp = get_unix_timestamp(since)
        if timestamp is None:
            raise typer.Exit(code=1)
        params['since'] = timestamp
        typer.echo(f"Fetching historical events since {since} (timestamp: {timestamp})...")
    else:
        params['time_filter'] = 'upcoming'
        typer.echo(f"Fetching upcoming events...")

    fetched_events = []
    
    try:
        while url:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            events = data.get('data', [])
            
            for event in events:
                # Generate the direct URL to the Facebook event
                event_url = f"https://www.facebook.com/events/{event['id']}"
                
                processed_event = {
                    'id': event.get('id'),
                    'name': event.get('name'),
                    'start_time': event.get('start_time'),
                    'end_time': event.get('end_time'),
                    'place': event.get('place', {}).get('name') if isinstance(event.get('place'), dict) else event.get('place'),
                    'description': event.get('description'),
                    'url': event_url
                }
                fetched_events.append(processed_event)
            
            # Check for next page
            url = data.get('paging', {}).get('next')
            # Parameters are included in the 'next' URL, so we don't need them for subsequent calls
            params = {} 

        # Ensure data directory exists
        output_path = Path('website/data/events.json')
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing events for merging
        existing_events = []
        if output_path.exists():
            try:
                with open(output_path, 'r', encoding='utf-8') as f:
                    existing_events = json.load(f)
            except (json.JSONDecodeError, IOError):
                typer.echo(f"Warning: Could not read existing events from {output_path}. Starting fresh.", err=True)

        # Merge and deduplicate using ID as key
        # Fetched events take precedence (updates)
        all_events_dict = {e['id']: e for e in existing_events}
        for event in fetched_events:
            all_events_dict[event['id']] = event
            
        # Convert back to list and sort by start_time (ascending - oldest first)
        merged_events = list(all_events_dict.values())
        merged_events.sort(key=lambda x: x.get('start_time', ''), reverse=False)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(merged_events, f, ensure_ascii=False, indent=2)
            
        typer.echo(f"Successfully fetched {len(fetched_events)} events.")
        typer.echo(f"Merged total: {len(merged_events)} events saved to {output_path}.")
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 400:
            typer.echo(f"Error: Facebook API returned a 400 Bad Request.", err=True)
            typer.echo(f"This usually means the access token is invalid or lacks permissions.", err=True)
            typer.echo(f"Details: {e.response.text}", err=True)
        else:
            typer.echo(f"HTTP Error: {e}", err=True)
        raise typer.Exit(code=1)
    except requests.exceptions.RequestException as e:
        typer.echo(f"API Request failed: {e}", err=True)
        if hasattr(e, 'response') and e.response is not None:
            typer.echo(f"Response content: {e.response.text}", err=True)
        raise typer.Exit(code=1)
    except Exception as e:
        typer.echo(f"An unexpected error occurred: {e}", err=True)
        raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
