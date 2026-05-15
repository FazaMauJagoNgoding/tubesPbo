$env:FIREBASE_API_KEY = "AIzaSyCe__H081_RPls06QgNWrO4Ad0L5hKFir0"
$env:FIREBASE_DATABASE_URL = "https://tubes-pbo-d50e4-default-rtdb.asia-southeast1.firebasedatabase.app"

javac -d out (Get-ChildItem -Recurse -Filter *.java src/main/java | ForEach-Object { $_.FullName })
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

java -cp out com.perpustakaan.Main
