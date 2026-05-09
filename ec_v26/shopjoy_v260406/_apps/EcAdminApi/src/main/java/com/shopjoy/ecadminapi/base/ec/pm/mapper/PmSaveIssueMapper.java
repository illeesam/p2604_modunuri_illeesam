package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmSaveIssueMapper {

    PmSaveIssueDto.Item selectById(@Param("id") String id);

    List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request req);

    List<PmSaveIssueDto.Item> selectPageList(PmSaveIssueDto.Request req);

    long selectPageCount(PmSaveIssueDto.Request req);

    int updateSelective(PmSaveIssue entity);
}
