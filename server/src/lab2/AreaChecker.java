package lab2;

import java.math.BigDecimal;

public final class AreaChecker {
    private static final BigDecimal TWO = BigDecimal.valueOf(2);

    private AreaChecker() {
    }

    public static boolean isHit(BigDecimal x, BigDecimal y, BigDecimal r) {
        boolean square = x.compareTo(r.negate()) >= 0 && x.signum() <= 0
                && y.signum() >= 0 && y.compareTo(r) <= 0;

        boolean triangle = x.signum() >= 0 && y.signum() >= 0
                && x.add(y.multiply(TWO)).compareTo(r) <= 0;

        boolean circle = x.signum() >= 0 && y.signum() <= 0
                && x.multiply(x).add(y.multiply(y)).compareTo(r.multiply(r)) <= 0;

        return square || triangle || circle;
    }
}
