# Services used in Legacy Architecture

## AWS IoT Core

    - Purpose: Acts as a gateway to other AWS services, enabling seamless integration with analytics, machine learning (e.g., Amazon SageMaker), and storage solutions.

        -> This allows developers to build end-to-end IoT applications without managing underlying infrastructure.
    
    - Details:

        - Device Connectivity & Communication

            - This platform allow devices to connect using standard protocols such as MQTT, HTTPS, WebSockets, and LoRaWAN.

            - It enabling communication even in low-bandwidth / high latency environments.

            - Also, it supports persistent connections, message retention, and advanced features like shared subsciptions and last-will messages, making it suitable for large-scale IoT deployments.
    
        - Data Management & Processing

            - This platform can filter, transform, and route device data to AWS services like Amazon S3, DynamoDB, Kinesis, and Lambda for storage, real-time processing, or analytics.

                -> Allows developers to build applications that act on IoT data, such as predictive maintenance, quality monitoring, or operational analytics.
    
        - Device Management

            - AWS IoT Core provides tools for organizing, monitoring, and managing large fleets of devices.

                - Features like Device Shadows maintain a virtual representation of each device, storing the last known state even when deivces are offline, which is essential for remote control and automation.

                - Device Advisor offers pre-build test suites to validate device functionality before deployment.
    
        - Security and Access Control

            - The services ensures mutual authentication and end-to-end encryption, safeguarding data and device connections.

            - Fine-grained access control through AWS Identity and Access Management (IAM) allows secure authorization for devices and applications.

## Node-RED

    - It is a low-code, flow-based programming tool designed to connect hardward, APIs, and online services for automation, IoT, and data processing applications.

    - Purpose: this tool is primarily designed to simplify the creation of event-driven applications by providing a visual, flow-based programming environment. 

    - Main Goals:

        - Connecting devices and services

            - Node-RED allows users to wire together hardware devices, APIs, and online services in a seamless way.
        
        - Data collection and transformation

            - Enables real-time data collection, processing, and visualization, making it ideal for monitoring and automation tasks.

        - Low-code accessibility

            - Its browser-based editor and drag-and-drop interface make it accessible to users with minimal programming experience while still suporting advanced JS functions for developers.
        
        - Event-driven architecture

            - Built on Node.js, Node-RED leverages non-blocking, event-drivem programming - which is efficient for handling asynchronous data streams.
    
    - Usages: 

        - IoT & Smart Home Automation

            - Node-RED can collect data from sensors (temperature, humidity, motion) and control actuators like lights, thermostats, and door locks based on predefined flows.

        - API Integration & Webhooks

            - It can receive real-time notifications from web services (e.g., GitHub webhooks) and trigger automated actions such as sending emails / updating databases.
        
        - Data Processing & Transformation

            - Node-RED can covert data formats (e.g., CSV to JSON), perform calculations, and route information to multiple destinations for analysis / storage.
        
        Industrial IoT (IIoT)

            - Node-RED supports protocols like MQTT, Modbus, and OPC-UA, making it suitable for industrial automation and edge computing applications.
        
        Rapid Prototyping

            - Developers can quickly build and deploy flows using a palette of pre-built nodes, extending functionality with custom nodes / JS code.
    
    - Core Components:

        - Nodes

            - Functional blocks representing tasks such as reading sensors, sending HTTP requests, or loggin data.
        
        - Function Nodes

            - Allow custom JS code for complex logic / data manipulation
        
        - Flows

            - Collections of connected nodes defining the sequence of operations and data flow.
        
        - Palette

            - A library of nodes that can be extended with additional packages for databases, cloud services, or hardware interfaces.
    
    - Deployment:

        - Can run on low-cose hardward like Raspberry Pi, on servers, or in the cloud -> Making it versatile for both hobbyist and professional applications.

## API Gateway

    - A fully managed service that enables developers to create, publish, maintain, monitor, and secure APIs at any scale.

    - Acting as a gateway between client applications and backend services.
    
    - Key Functions:

        - API Management

            - Simplifies the process of managing APIs by providing tools for creating, deploying, and monitoring APIs.

            - It allows developers to focus on writing application code rather than dealing with infrastructure complexities.
        
        - Integration with Backend Services

            - Acts a "front door" for applications to access data, business logic, or functionality from backend services such as AWS Lambda, Amazon EC2, or other web applications.

            - This integration facilities seamless communication between client applications and server-side resources.
        
        - Support for Multiple API Types

            - Supports various types of APIs, including REST, HTTP, and WebSocket APIs.

                -> This versatility allows developers to choose the appropriate API type based on their application needs, whether for stateless communication / real-time interactions.
        
        - Security Features

            - The service provides robust security mechanisms, including authenticaiton and authorization through AWS Identity & Access Management (IAM), custom authorizers, and Amazon Cognito.

                -> These features help protect APIs from unauthorized access.
        
        - Traffic Management

            - API Gateway includes capabilities for traffic management, such as request throttling, caching, and load balancing.

                -> These features ensure optimal performance and availability of APIs, even under heavy traffic conditions.
        
        - Monitoring and Analytics

            - Integrated with Amazon CloudWatch, API Gateway allows developers to monitor API performance, track usage metrics, and log requests.

                -> This monitoring capability helps in diagnosing issues and optimizing API performance.
        
        - Version Management

            - Enables developers to management different versions of their APIs, ensuring that clients using various versions receive the correct functionality and updates.

## AWS Lambda

    - Provide a fully managed, scalable, and cost-efficient platform for running code in response to events

        -> Enabling developers to build serverless applications without worrying about underlying infrastructure.

    - Designed to simplify cloud computing by removing the need to provision / manage servers.

    - AWS handles insfrastructure tasks such as server provisioning, scaling, patching, and security updates.

    - It operates on an serverless, event-driven model - meaning functions are executed only in response to specific events, such as file uploads to S3, API requests via API Gateway, or database updates in DynamoDB

    - Key Benefits:

        - Automatic Scaling

            - Lambda automatically scales functions in response to incoming events, from a few requests per day to 1000s per second, without manual configuration.
        
        - Pay-Per-User Pricing

            - Users are charged only for the compute time consumed and the number of requests, making it cost-effective for variable workloads.
        
        - Event-Driven Architecture

            - Functions remain idle until triggered, enabling efficient resource utilization and real-time responsiveness
        
        - Integration with AWS Services

            - Lambda seamlessly connects with services like S3, DynamoDB, Kinesis, API Gateway, and more, allowing developers to build complex workflows and serverless application
    
    - Common User Cases:

        - File Processing

            - Automatically process files uploaded to S3, such as resizing images or transforming data.
        
        - Web and Mobile Backends

            - Serve APIs and handle requets without managing servers.
        
        - Stream Processing

            - Analyze real-time data streams for monitoring / analytics.
        
        - Scheduled Tasks

            - Run periodic operations using EventBridge / CloudWatch.
        
        - Database Operations

            - Respond to database changes and automate workflows
    
## DynamoDB
