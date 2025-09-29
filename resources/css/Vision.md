Vision:

- users
    - owner can delete activity others can't
    - if no entities explain a bit more on empty list
    - how to handle users responsible for some events (have system user for integrations,...)
        - Connect with Github fo ordinary users to quickly add some important changes

- integrations
    - Gitlab webhook should be linked to ecosystem or something - so its not easibly changed and you can get info from other webhooks
    - Gitlab better settings
    - Gitlab scrollable repositories
    - what should disconnect do?
    - update active status with reverb, so it immediatelly shows that is active
    - if integration disconnects show notification on sidebar integrations button

- custom integration
    - create custom integration (when some service send request to our endpoint)
- server integration - make it more visibe what is possible to select


-> Dashboard
    -> fix activity count
    -> add settings
        -> to edit name of the ecosystem
        -> to invite people into the ecosystem

-> Activities
    -> if no activities, check if user has any integrations,
        -> if not add quick link to add integrations
    -> if regular user the user field on manual added activities should be auth
        -> if owner he can select other users


For webhook to work:
smee -u https://smee.io/F0RTbCU8nfyYY -t http://localhost/api/gitlab/webhook