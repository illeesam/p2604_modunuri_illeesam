package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmGiftIssueMapper {

    PmGiftIssueDto selectById(@Param("id") String id);

    List<PmGiftIssueDto> selectList(@Param("p") Map<String, Object> p);

    List<PmGiftIssueDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmGiftIssue entity);
}
