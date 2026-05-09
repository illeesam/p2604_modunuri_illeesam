package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmGiftIssueMapper {

    PmGiftIssueDto.Item selectById(@Param("id") String id);

    List<PmGiftIssueDto.Item> selectList(PmGiftIssueDto.Request req);

    List<PmGiftIssueDto.Item> selectPageList(PmGiftIssueDto.Request req);

    long selectPageCount(PmGiftIssueDto.Request req);

    int updateSelective(PmGiftIssue entity);
}
