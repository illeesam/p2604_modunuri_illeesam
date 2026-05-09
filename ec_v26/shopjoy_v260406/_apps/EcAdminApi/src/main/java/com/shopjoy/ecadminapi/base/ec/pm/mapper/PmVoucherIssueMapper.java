package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmVoucherIssueMapper {

    PmVoucherIssueDto.Item selectById(@Param("id") String id);

    List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request req);

    List<PmVoucherIssueDto.Item> selectPageList(PmVoucherIssueDto.Request req);

    long selectPageCount(PmVoucherIssueDto.Request req);

    int updateSelective(PmVoucherIssue entity);
}
