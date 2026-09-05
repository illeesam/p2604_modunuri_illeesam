import java.sql.*;
public class CheckSyProp {
    public static void main(String[] a) throws Exception {
        try (Connection con = DriverManager.getConnection(
                "jdbc:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604",
                "postgres", "postgresilleesam");
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(
                 "SELECT prop_id, prop_key, prop_value, prop_profile, use_yn FROM sy_prop WHERE prop_key LIKE 'app.file%' ORDER BY prop_key, prop_profile")) {
            while (rs.next()) System.out.println(rs.getString(1)+" | "+rs.getString(2) + " | " + rs.getString(3) + " | profile=" + rs.getString(4) + " | use=" + rs.getString(5));
        }
    }
}
