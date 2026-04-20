package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbMemberGradeMapper {

    MbMemberGradeDto selectById(@Param("id") String id);

    List<MbMemberGradeDto> selectList(@Param("p") Map<String, Object> p);

    List<MbMemberGradeDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbMemberGrade entity);
}
