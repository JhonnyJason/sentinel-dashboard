#!/usr/bin/bash
set -e
sudo systemctl start nginx

# Remount on every run: clears stacked mounts and picks up the newly built file
rebind() {
    while mountpoint -q "$2"; do sudo umount "$2"; done
    sudo mount --bind "$1" "$2"
}

# rebind the service.js files for the required services
rebind /home/lenny/thingies/sentinel-access-manager/output/service.js /opt/void/sentinel-access-manager/service.js
rebind /home/lenny/thingies/sentinel-backend/output/service.js /opt/void/sentinel-backend/service.js
rebind /home/lenny/thingies/sentinel-datahub/output/service.js /opt/void/sentinel-datahub/service.js
rebind /home/lenny/thingies/stripe-connect-dotv/testing/build/service.js /opt/void/stripe-connect-dotv/service.js
rebind /home/lenny/thingies/link-guardian/testing/build/service.js /opt/void/link-guardian/service.js
rebind /home/lenny/thingies/bugsnitch/output/service.js /opt/void/bugsnitch/service.js

# rebind all working directories for the services
rebind /home/lenny/thingies/sentinel-access-manager/testing/testing-wd/ /srv/srvcs/sentinel-access-manager/
rebind /home/lenny/thingies/sentinel-backend/testing/testing-wd/ /srv/srvcs/sentinel-backend/
rebind /home/lenny/thingies/sentinel-datahub/testing/testing-wd/ /srv/srvcs/sentinel-datahub/
rebind /home/lenny/thingies/stripe-connect-dotv/testing/testing-wd/ /srv/srvcs/stripe-connect-dotv/
rebind /home/lenny/thingies/link-guardian/testing/testing-wd/ /srv/srvcs/link-guardian/
rebind /home/lenny/thingies/bugsnitch/testing/testing-wd/ /srv/srvcs/bugsnitch/

# rebind the local testing CA-root cert created by mkcert 
rebind /home/lenny/.local/share/mkcert/ /opt/void/mkcert/
