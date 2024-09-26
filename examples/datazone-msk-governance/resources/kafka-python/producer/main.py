from producer_factory import ProducerFactory
import yaml

def main():
    with open('config.yaml', 'r') as config_file:
        config = yaml.safe_load(config_file)

    auth_type = config['kafka']['authentication']
    job_name = 'producer-job'
    schema_file_path = config['gsr']['schema_file']
    outputs = []

    # Create the producer factory (no need to handle token provider here)
    producer_factory = ProducerFactory(auth_type, job_name, outputs, schema_file_path)
    producer = producer_factory.get_producer()

    names = ['Francisco Doe', 'Jane Smith', 'John Doe']
    favorite_numbers = [6, 7, 42]

    try:
        for name in names:
            for number in favorite_numbers:
                data = {'name': name, 'favorite_number': number}
                producer.send_with_schema(config['kafka']['topic'], data)
                print(f"Sent data: {data}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
