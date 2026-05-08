package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbLikeMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbLikeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbLikeService {

    private final MbLikeMapper mbLikeMapper;
    private final MbLikeRepository mbLikeRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public MbLikeDto getById(String id) {
        MbLikeDto result = mbLikeMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<MbLikeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbLikeDto> result = mbLikeMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<MbLikeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbLikeMapper.selectPageList(p), mbLikeMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(MbLike entity) {
        int result = mbLikeMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbLike create(MbLike entity) {
        entity.setLikeId(CmUtil.generateId("mb_like"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbLike result = mbLikeRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public MbLike save(MbLike entity) {
        if (!mbLikeRepository.existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 MbLike입니다: " + entity.getLikeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbLike result = mbLikeRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!mbLikeRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbLike입니다: " + id);
        mbLikeRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<MbLike> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbLike row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setLikeId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_like"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbLikeRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getLikeId(), "likeId must not be null");
                MbLike entity = mbLikeRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "likeId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbLikeRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getLikeId(), "likeId must not be null");
                if (mbLikeRepository.existsById(id)) mbLikeRepository.deleteById(id);
            }
        }
    }
}