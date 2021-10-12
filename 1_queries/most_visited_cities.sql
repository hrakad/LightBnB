SELECT city, COUNT(property_id) AS total_reservations
FROM properties 
JOIN reservations ON  properties.id = property_id
GROUP BY properties.city
ORDER BY COUNT(property_id) DESC;
