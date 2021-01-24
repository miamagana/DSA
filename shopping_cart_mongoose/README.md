# Shopping cart module

This is the module to store the code relative to the shopping cart.

To run the code execute the following command in the following folders

    npm install

- cart_service
- data_service
- service-registry

Second, in the folder execute the following, that would run the db and registry service on fixed ports.

    docker-compose up -d

Third, execute the following command.

    node data_service/bin/run

Finally, execute the following command.

    node cart_service/bin/run

To stop the containers execute the following command.

    docker-compose down

Additionally, you can run the postman collection here attached.
