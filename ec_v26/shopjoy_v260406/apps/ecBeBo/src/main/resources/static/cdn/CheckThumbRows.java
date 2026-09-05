import java.sql.*;
public class CheckThumbRows {
    public static void main(String[] a) throws Exception {
        try (Connection con = DriverManager.getConnection(
                "jdbc:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604",
                "postgres", "postgresilleesam");
             PreparedStatement ps = con.prepareStatement(
                 "SELECT attach_id, file_nm, storage_path, physical_path, thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn " +
                 "FROM sy_attach WHERE attach_id IN ('AT2605031759320481','AT2606132045309254','AT2607262322519026')")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                for (int i=1;i<=9;i++) System.out.print(rs.getMetaData().getColumnName(i)+"="+rs.getString(i)+" | ");
                System.out.println();
            }
        }
    }
}
