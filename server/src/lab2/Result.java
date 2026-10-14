package lab2;

import java.time.Instant;

public record Result(Point point, boolean hit, Instant time, long execNanos) {
}
