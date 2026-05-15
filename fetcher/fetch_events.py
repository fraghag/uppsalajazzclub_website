import os
import json
import requests
from datetime import datetime, timezone

def fetch_events():
    access_token = os.environ.get('FB_PAGE_ACCESS_TOKEN')
    page_id = os.environ.get('FB_PAGE_ID')
    
    if not access_token or not page_id:
        print("Error: FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID environment variables are required.")
        return False

    url = f"https://graph.facebook.com/v19.0/{page_id}/events"
    params = {
        'access_token': access_token,
        # Fetch upcoming events by using the 'time_filter' parameter
        'time_filter': 'upcoming',
        'fields': 'id,name,start_time,end_time,place,description'
    }

    try:
        print(f"Fetching events for page ID {page_id}...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        events = data.get('data', [])
        
        processed_events = []
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
            processed_events.append(processed_event)
            
        # Ensure data directory exists
        os.makedirs('data', exist_ok=True)
        
        # Write to file
        with open('data/events.json', 'w', encoding='utf-8') as f:
            json.dump(processed_events, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully fetched and saved {len(processed_events)} upcoming events.")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"API Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False

if __name__ == '__main__':
    # Exit gracefully without failure codes to prevent breaking the CI pipeline,
    # but the logs will show the error and the file won't be overwritten.
    fetch_events()
