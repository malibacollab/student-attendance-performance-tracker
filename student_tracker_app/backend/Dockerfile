# 1. Base Image
FROM python:3.9-slim-buster

# 2. Environment Variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Set Working Directory
WORKDIR /app

# 4. Install Dependencies
# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# 5. Copy Application Code
# "." in the context of backend directory, copying its content to /app in container
COPY . .

# 6. Expose Port
EXPOSE 5000

# 7. Command to Run Application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
