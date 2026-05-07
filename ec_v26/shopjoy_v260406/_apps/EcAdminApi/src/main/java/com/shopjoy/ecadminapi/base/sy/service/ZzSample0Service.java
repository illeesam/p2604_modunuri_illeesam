package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample0Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample0Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample0Service {


    private final ZzSample0Mapper zzSample0Mapper;
    private final ZzSample0Repository zzSample0Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public ZzSample0Dto getById(String id) {
        // zz_sample0 :: select one :: id [orm:mybatis]
        return zzSample0Mapper.selectById(id);
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<ZzSample0Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // zz_sample0 :: select list :: p [orm:mybatis]
        return zzSample0Mapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<ZzSample0Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // zz_sample0 :: select page :: p [orm:mybatis]
        return PageResult.of(zzSample0Mapper.selectPageList(p), zzSample0Mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(ZzSample0 entity) {
        // zz_sample0 :: update :: entity [orm:mybatis]
        return zzSample0Mapper.updateSelective(entity);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample0 create(ZzSample0 entity) {
        entity.setSample0Id(CmUtil.generateId("zz_sample0"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // zz_sample0 :: insert or update :: [orm:jpa]
        return zzSample0Repository.save(entity);
    }

    /** save — 저장 */
    @Transactional
    public ZzSample0 save(ZzSample0 entity) {
        if (!zzSample0Repository.existsById(entity.getSample0Id()))
            throw new CmBizException("존재하지 않는 ZzSample0입니다: " + entity.getSample0Id());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // zz_sample0 :: insert or update :: [orm:jpa]
        return zzSample0Repository.save(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample0 entity = zzSample0Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        zzSample0Repository.delete(entity);
        em.flush();
        if (zzSample0Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
