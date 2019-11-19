json_files=`ls performance-testing/results/*.json`

for file in $json_files
do
  echo "processing $file..."

  sed -i '' 's/$/,/' "$file"
  sed -i '' '$ s/.$//' "$file"
  sed -i '' '1s/^/[/' "$file"
  echo ']' >> $file
done