INSERT INTO users (email, anon_name, password_hash)
VALUES
  ('demo@diu.edu.bd', 'Anon demo', '$2a$10$8wY0a9U4Y5OfhUFzFwe0fObY.T8fNE2WL3N7f6Zj5Q0YfmyxPH7L2'),
  ('alex@diu.edu.bd', 'Anon alex', '$2a$10$8wY0a9U4Y5OfhUFzFwe0fObY.T8fNE2WL3N7f6Zj5Q0YfmyxPH7L2')
ON CONFLICT (email) DO NOTHING;

INSERT INTO posts (user_id, content, status)
SELECT u.id, 'Library AC is not working on the 4th floor.', 'approved'
FROM users u
WHERE u.email = 'alex@diu.edu.bd'
  AND NOT EXISTS (
    SELECT 1
    FROM posts p
    WHERE p.user_id = u.id
      AND p.content = 'Library AC is not working on the 4th floor.'
  );
