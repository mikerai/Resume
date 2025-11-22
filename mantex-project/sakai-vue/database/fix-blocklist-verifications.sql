-- Fix blocklist_verifications table to support both CURP and RFC
-- CURP es 18 caracteres, RFC es 12-13 caracteres

-- Cambiar el campo rfc a identifier_value y ampliar el tamaño
ALTER TABLE blocklist_verifications
  RENAME COLUMN rfc TO identifier_value;

ALTER TABLE blocklist_verifications
  ALTER COLUMN identifier_value TYPE VARCHAR(20);

-- Agregar comentario para clarificar
COMMENT ON COLUMN blocklist_verifications.identifier_value IS 'CURP (18 chars) o RFC (12-13 chars) usado para la consulta de blocklist';
