package lab2;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class FormData {
    private final Map<String, String> fields = new HashMap<>();

    public FormData(byte[] body) {
        String text = new String(body, StandardCharsets.UTF_8);
        for (String pair : text.split("&")) {
            if (pair.isEmpty()) {
                continue;
            }
            String[] parts = pair.split("=", 2);
            String key = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
            String value = parts.length > 1 ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "";
            if (fields.put(key, value) != null) {
                throw new ValidationException("Параметры не должны повторяться");
            }
        }
    }

    public String get(String name) {
        String value = fields.get(name);
        if (value == null) {
            throw new ValidationException("Не передан параметр " + name.toUpperCase());
        }
        return value;
    }
}
