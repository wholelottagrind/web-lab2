package lab2;

import java.math.BigDecimal;

public class AreaChecker {
    public static boolean isHit(Point point) {
        BigDecimal x = point.x();
        BigDecimal y = point.y();
        BigDecimal r = point.r();

        boolean square = x.compareTo(r.negate()) >= 0 && x.signum() <= 0
                && y.signum() >= 0 && y.compareTo(r) <= 0;

        boolean triangle = x.signum() >= 0 && y.signum() >= 0
                && x.add(y.multiply(BigDecimal.valueOf(2))).compareTo(r) <= 0;

        boolean circle = x.signum() >= 0 && y.signum() <= 0
                && x.multiply(x).add(y.multiply(y)).compareTo(r.multiply(r)) <= 0;

        return square || triangle || circle;
    }
}
