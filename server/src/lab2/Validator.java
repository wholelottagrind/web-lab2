package lab2;

import java.math.BigDecimal;
import java.util.Set;
import java.util.regex.Pattern;

public final class Validator {
    private static final Set<String> ALLOWED_X = Set.of("-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3");
    private static final Pattern DECIMAL = Pattern.compile("[+-]?\\d+([.,]\\d+)?");
    private static final int MAX_NUMBER_LENGTH = 30;

    private Validator() {
    }

    public static Point validate(FormData form) {
        String x = form.single("x");
        if (!ALLOWED_X.contains(x)) {
            throw new ValidationException("X должен быть одним из: -5, -4, -3, -2, -1, 0, 1, 2, 3");
        }
        BigDecimal y = parseInOpenInterval(form.single("y"), "Y", -5, 5);
        BigDecimal r = parseInOpenInterval(form.single("r"), "R", 2, 5);
        return new Point(new BigDecimal(x), y, r);
    }

    private static BigDecimal parseInOpenInterval(String raw, String name, int min, int max) {
        String text = raw.trim();
        if (text.length() > MAX_NUMBER_LENGTH || !DECIMAL.matcher(text).matches()) {
            throw new ValidationException(name + " должен быть десятичным числом");
        }
        BigDecimal value = new BigDecimal(text.replace(',', '.'));
        if (value.compareTo(BigDecimal.valueOf(min)) <= 0 || value.compareTo(BigDecimal.valueOf(max)) >= 0) {
            throw new ValidationException(name + " должен быть строго между " + min + " и " + max);
        }
        return value;
    }
}
