package lab2;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record FormData(Map<String, List<String>> fields) {
    public static FormData parse(byte[] body) {
        String text = new String(body, StandardCharsets.UTF_8);
        Map<String, List<String>> fields = new HashMap<>();
        for (String pair : text.split("&")) {
            if (pair.isEmpty()) {
                continue;
            }
            String[] parts = pair.split("=", 2);
            try {
                String key = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
                String value = parts.length > 1 ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "";
                fields.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Некорректное кодирование формы");
            }
        }
        return new FormData(fields);
    }

    public String single(String name) {
        List<String> values = fields.get(name);
        if (values == null || values.isEmpty()) {
            throw new ValidationException("Не передан параметр " + name.toUpperCase());
        }
        if (values.size() > 1) {
            throw new ValidationException("Параметр " + name.toUpperCase() + " передан несколько раз");
        }
        return values.get(0);
    }
}
