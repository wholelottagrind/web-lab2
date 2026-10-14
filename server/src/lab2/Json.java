package lab2;

import java.util.List;
import java.util.StringJoiner;

public class Json {
    public static String history(List<Result> history) {
        StringJoiner rows = new StringJoiner(",", "[", "]");
        for (Result result : history) {
            rows.add(row(result));
        }
        return "{\"history\":" + rows + "}";
    }

    public static String error(String message) {
        return "{\"error\":" + string(message) + "}";
    }

    private static String row(Result result) {
        return "{\"x\":" + result.point().x().toPlainString()
                + ",\"y\":" + string(result.point().y().toPlainString())
                + ",\"r\":" + string(result.point().r().toPlainString())
                + ",\"hit\":" + result.hit()
                + ",\"time\":" + string(result.time().toString())
                + ",\"execNanos\":" + result.execNanos()
                + "}";
    }

    private static String string(String value) {
        return "\"" + value + "\"";
    }
}
